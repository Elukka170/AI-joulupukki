require('dotenv').config();
const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const axios = require('axios');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

app.post('/submit', async (req, res) => {
  const { name, phone } = req.body;
  console.log(`Puhelu varattu: ${name} -> ${phone}`);
  res.status(200).send('Tilaus vastaanotettu!');
});

app.post('/voice', async (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({ input: 'speech', action: '/handle_speech', method: 'POST' });
  gather.say("Hohohoo! Täällä Joulupukki! Mikäs sinun nimesi on?");
  res.type('text/xml');
  res.send(twiml.toString());
});

app.post('/handle_speech', async (req, res) => {
  const userInput = req.body.SpeechResult || 'En kuullut vastaustasi';
  try {
    const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Olet ystävällinen, iloinen ja turvallinen Joulupukki. Vastaa lyhyesti ja hauskasti lapsille.' },
        { role: 'user', content: userInput }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const responseText = openaiResponse.data.choices[0].message.content;
    const twiml = new VoiceResponse();
    twiml.say(responseText);
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error(error);
    const twiml = new VoiceResponse();
    twiml.say("Hupsista, Joulupukki taisi kompastua piippuun! Koitetaanpa myöhemmin uudestaan.");
    res.type('text/xml');
    res.send(twiml.toString());
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveri käynnissä portissa ${PORT}`);
});


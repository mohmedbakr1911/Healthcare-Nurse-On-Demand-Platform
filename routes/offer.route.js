const nursesOfferController = require('../controllers/nursesOffer.controller');
const { getIO } = require('../ioServer');   
const express = require('express');
const router = express.Router();    

router.post('/nurses/offer', async (req, res) => {
  try {
    const offerData = req.body;
    const newOffer = await nursesOfferController.createNurseOffer(offerData);
    res.status(201).json(newOffer);
  } catch (error) {
    console.error('Error creating nurse offer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/nurses/offer/notify', async (req, res) => {
  try {
    const { serviceId, nurseId, message } = req.body;
    const io = getIO();
    io.to(`nurse_${nurseId}`).emit('offerNotification', { serviceId, message });
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
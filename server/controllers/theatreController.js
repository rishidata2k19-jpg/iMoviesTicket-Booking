const Theatre = require('../models/theatreModel');

// Helper to generate a default seat grid if admin doesn't provide custom layout
const createDefaultSeatLayout = (prefix, rowsCount, colsCount) => {
  const seats = {};
  for (let r = 0; r < rowsCount; r++) {
    const rowLetter = String.fromCharCode(prefix.charCodeAt(0) + r);
    for (let c = 1; c <= colsCount; c++) {
      const seatId = `${rowLetter}${c}`;
      seats[seatId] = { row: rowLetter, number: c };
    }
  }
  return seats;
};

// 1. Get all theatres
exports.getAllTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: theatres.length, theatres });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get single theatre
exports.getTheatreById = async (req, res) => {
  try {
    const { id } = req.params;
    const theatre = await Theatre.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { theatreId: id }],
    });

    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found.' });
    }

    return res.status(200).json({ success: true, theatre });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create theatre (Admin)
exports.createTheatre = async (req, res) => {
  try {
    const {
      theatreName,
      theatreId,
      location,
      balconySeatPrice,
      middleSeatPrice,
      lowerSeatPrice,
      balconySeats,
      middleSeats,
      lowerSeats,
      facilities,
    } = req.body;

    const generatedTheatreId = theatreId || 'THTR-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // If seats layouts not passed, generate rich defaults
    const finalBalcony = balconySeats || createDefaultSeatLayout('A', 2, 10); // A1..B10
    const finalMiddle = middleSeats || createDefaultSeatLayout('C', 3, 10);   // C1..E10
    const finalLower = lowerSeats || createDefaultSeatLayout('F', 2, 10);    // F1..G10

    const theatre = await Theatre.create({
      theatreName,
      theatreId: generatedTheatreId,
      location,
      balconySeatPrice: Number(balconySeatPrice),
      middleSeatPrice: Number(middleSeatPrice),
      lowerSeatPrice: Number(lowerSeatPrice),
      balconySeats: finalBalcony,
      middleSeats: finalMiddle,
      lowerSeats: finalLower,
      facilities: facilities || ['Dolby Atmos', '4K Laser Projection', 'Recliner Seats', 'Cafeteria'],
    });

    return res.status(201).json({ success: true, message: 'Theatre created successfully!', theatre });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// 4. Update theatre (Admin)
exports.updateTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    const theatre = await Theatre.findByIdAndUpdate(id, req.body, { new: true });

    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found.' });
    }

    return res.status(200).json({ success: true, message: 'Theatre updated successfully!', theatre });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// 5. Delete theatre (Admin)
exports.deleteTheatre = async (req, res) => {
  try {
    const { id } = req.params;
    const theatre = await Theatre.findByIdAndDelete(id);

    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found.' });
    }

    return res.status(200).json({ success: true, message: 'Theatre deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

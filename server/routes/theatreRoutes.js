const express = require('express');
const router = express.Router();
const theatreController = require('../controllers/theatreController');
const { requireAdmin } = require('../middlewares/fetchUser');

router.get('/', theatreController.getAllTheatres);
router.get('/:id', theatreController.getTheatreById);
router.post('/', requireAdmin, theatreController.createTheatre);
router.put('/:id', requireAdmin, theatreController.updateTheatre);
router.delete('/:id', requireAdmin, theatreController.deleteTheatre);

module.exports = router;

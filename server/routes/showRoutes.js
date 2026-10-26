const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');
const { requireAdmin } = require('../middlewares/fetchUser');

router.get('/', showController.getAllShows);
router.get('/:id', showController.getShowById);
router.post('/', requireAdmin, showController.createShow);
router.put('/:id', requireAdmin, showController.updateShow);
router.delete('/:id', requireAdmin, showController.deleteShow);

module.exports = router;

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { fetchUser } = require('../middlewares/fetchUser');

router.get('/:movieId', reviewController.getMovieReviews);
router.post('/', fetchUser, reviewController.addReview);
router.delete('/:id', fetchUser, reviewController.deleteReview);

module.exports = router;

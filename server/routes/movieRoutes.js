const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { requireAdmin } = require('../middlewares/fetchUser');

// TMDB Dedicated Endpoints
router.get('/tmdb/now-playing', movieController.getTmdbNowPlaying);
router.get('/tmdb/popular', movieController.getTmdbPopular);
router.get('/tmdb/search', movieController.searchTmdbMovies);

// Primary CRUD / TMDB Live Market Integration
router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieById);
router.post('/', requireAdmin, movieController.createMovie);
router.put('/:id', requireAdmin, movieController.updateMovie);
router.delete('/:id', requireAdmin, movieController.deleteMovie);

module.exports = router;

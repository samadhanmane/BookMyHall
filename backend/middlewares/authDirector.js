import jwt from 'jsonwebtoken';
import Director from '../models/directorModel.js';

const authDirector = async (req, res, next) => {
    try {
        const token = req.headers['dtoken'] || req.headers['token'] || req.headers['authorization'];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || decoded.role !== 'director') {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }
        const director = await Director.findById(decoded.id);
        if (!director) {
            return res.status(401).json({ success: false, message: 'Director not found.' });
        }
        req.director = director;
        req.user = decoded; // Attach decoded JWT payload for downstream use
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
};

export default authDirector; 
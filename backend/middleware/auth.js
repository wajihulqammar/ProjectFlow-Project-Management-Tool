const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'projectflow-secret-key');
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(err);
  }
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'projectflow-secret-key');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const requireProjectAccess = (roles = []) => {
  return async (req, res, next) => {
    try {
      const Project = require('../models/Project');
      const projectId = req.params.projectId || req.params.id || req.body.project;
      
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const member = project.members.find(m => m.user.toString() === req.user._id.toString());
      const isOwner = project.owner.toString() === req.user._id.toString();

      if (!isOwner && !member) {
        return res.status(403).json({ error: 'Not a member of this project' });
      }

      if (roles.length > 0) {
        const memberRole = isOwner ? 'owner' : member?.role;
        if (!roles.includes(memberRole)) {
          return res.status(403).json({ error: 'Insufficient project permissions' });
        }
      }

      req.project = project;
      req.memberRole = isOwner ? 'owner' : member?.role;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { authenticate, authenticateSocket, requireRole, requireProjectAccess };
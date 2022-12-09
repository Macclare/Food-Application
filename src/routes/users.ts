import express from 'express';
import {Register, VerifyUser, Login, ResendOTP, getAllUsers, getSingleUser, updateUserProfile} from '../controller/usersController'
import {auth} from '../middleware/authorization'

const router = express.Router();

router.post('/signup', Register)
router.post('/verify/:signature',VerifyUser)
router.post('/login/', Login)
router.get('/resend-otp/:signature', ResendOTP)
router.get('/get-all-users', getAllUsers)
router.get('/get-user', auth, getSingleUser)
router.patch('/update-profile', auth, updateUserProfile)




export default router;
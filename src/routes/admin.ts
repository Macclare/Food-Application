import express from 'express';
import {AdminRegister, CreateVendor, SuperAdminRegister} from '../controller/adminController'
import {auth} from '../middleware/authorization'

const router = express.Router();

router.post('/create-admin', auth, AdminRegister)
router.post('/create-super-admin',  SuperAdminRegister)
router.post('/create-vendors', auth, CreateVendor)



export default router;
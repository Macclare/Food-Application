import express from 'express';
import { createFood, deleteFood, updateVendorProfile, vendorLogin, vendorProfile, GetAllVendors, GetFoodByVendor} from '../controller/vendorController'
import { authVendor } from '../middleware/authorization';
import { upload } from '../utils/multer';
//import {auth} from '../middleware/authorization'

const router = express.Router();

router.get("/get-all-vendors", GetAllVendors)
router.get("/get-vendor-food/:id", GetFoodByVendor)
router.post('/login', vendorLogin)
router.post('/create-food', authVendor,  upload.single("image"), createFood)
router.get('/get-profile', authVendor, vendorProfile)
router.patch('/update-vendor-profile', authVendor, upload.single("coverImage"), updateVendorProfile)
router.delete('/delete-food/:foodid', authVendor, deleteFood)




export default router;
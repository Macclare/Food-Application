import express, { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid'
import { FoodAttributes, FoodInstance } from "../model/foodModel";
import { VendorAttributes, VendorInstance } from "../model/vendorModel";
import { GenerateSignature, loginSchema, validatePassword, option, updateVendorSchema } from "../utils";


/**==================Vendor login==================== **/
export const vendorLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const validateResult = loginSchema.validate(req.body, option);
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }
        // check if vendor exists
        const Vendor = await VendorInstance.findOne({
            where: { email: email }
        }) as unknown as VendorAttributes;
        
  if (Vendor) {
  const validation = await validatePassword(password, Vendor.password, Vendor.salt)
        if(validation){
        // Generate signature for vendor
        let signature = await GenerateSignature({
            id: Vendor.id,
            email: Vendor.email,
            serviceAvailable: Vendor.serviceAvailable
                });
                return res.status(200).json({
                    message: "Login successful",
                    signature,
                    email: Vendor.email,
                    serviceAvailable: Vendor.serviceAvailable,
                    role: Vendor.role
                })
            }
        }
        return res.status(400).json({
            Error: "Wrong Username or password or not a vendor"
        })
    } catch (err) {
      return res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/login"
        })
    }
}

/**==================Vendor add Food==================== **/
export const createFood = async (req:JwtPayload, res: Response) => {
    try {
        const id = req.vendor.id;
        const { name, price, description, category, foodType, readyTime, image} = req.body;
       
        // check if the vendor exists
        const Vendor = await VendorInstance.findOne({
            where: { id: id}
        }) as unknown as VendorAttributes;
      
        const foodid = uuidv4()
        if (Vendor) {   
     const createfood = await FoodInstance.create({
                id: foodid,
                name,
                price,
                description,
                category,
                foodType,
                readyTime,
                rating: 0,
                image: req.file.path,
                vendorId: id
     }) as unknown as FoodAttributes;
         return res.status(201).json({
                message: "Food added successfully",
                createfood
            })
 }
        return res.status(400).json({
            Error: "Vendor does not exist"
        })
    

    } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/create-food"
        })
    }
}

/**==================Get Vendor Profile==================== **/

export const vendorProfile = async(req:JwtPayload, res:Response) => {
try{
    const id = req.vendor.id;
 
    // check if the vendor exists
    const Vendor = await VendorInstance.findOne({
        where: { id: id},
        attributes: {exclude: ["password", "salt", "createdAt", "updatedAt"]},
        include: [{
            model: FoodInstance,
            as: "food",
            attributes: ["id", "name", "price", "description", "category", "foodType", "readyTime", "rating", "vendorId"]
        }]
    }) as unknown as VendorAttributes;
  
    return res.status(201).json({
       Vendor
    })

}catch(err){
    res.status(500).json({
        Error: "Internal server Error",
        route: "/vendors/get-profile"
    }) 
}
}

/**==================Vendor Delete food==================== **/

export const deleteFood =async (req:JwtPayload, res:Response) => {
    try{
     const id = req.vendor.id;
   const foodid = req.params.foodid;
// check if the vendor exists
  const Vendor = await VendorInstance.findOne({
    where: { id: id}
     }) as unknown as VendorAttributes; 

 if (Vendor){
        const deletedFood = await FoodInstance.destroy({where: { id: foodid }})

        return res.status(200).json({
            message: "Food deleted successfully",
            deletedFood
        })
    }
    return res.status(400).json({
        Error: "Food does not exist"
    })
            
    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/delete-food"
        }) 
    }
}

export const updateVendorProfile = async (req: JwtPayload, res: Response) => {
    try{
const id = req.vendor.id;
 const { name, address, phone, coverImage} = req.body;
    const validateResult = updateVendorSchema.validate(req.body, option);
    if (validateResult.error) {
        return res.status(400).json({
            Error: validateResult.error.details[0].message
        })
    }
    // find user by id
    const Vendor = await VendorInstance.findOne({
        where: {id:id}
    }) as unknown as VendorAttributes;
    if (!Vendor) {
        return res.status(400).json({
            Error: 'You are not authorized to update this profile'
        })
    }
const updatedVendor = await VendorInstance.update({ 
    name, address, phone, coverImage:req.file.path }, 
    { where: { id: id } }) as unknown as VendorAttributes;
    if (updatedVendor) {
     const Vendor = await VendorInstance.findOne({
            where: {id:id}
     }) as unknown as VendorAttributes;
        return res.status(200).json({
            message: 'Profile updated successfully',
            Vendor
        })
    }
    return res.status(400).json({
        Error: 'Error updating profile'
    })

    }catch(err){
       return res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/update-vendor-profile"
        })
    }
}

/************************************** get all Vendor **************************************/
export const GetAllVendors = async (req:JwtPayload, res:Response)=>{
    try{
             // check if vendor exist
const Vendor = await VendorInstance.findAndCountAll({}) 
    return res.status(200).json({
        vendor: Vendor.rows,
    })
    }catch(err){
    res.status(500).json({
        Error:"Internal server Error",
        route:"/vendors/get-profile"
    })
  } 
  }

/************************************** get all Vendor **************************************/
export const GetFoodByVendor = async(req:Request, res:Response) =>{
    try{
        const id = req.params.id;
     
        // check if the vendor exists
        const Vendor = await VendorInstance.findOne({
            where: { id: id},
            include: [{
                model: FoodInstance,
                as: "food",
                attributes: ["id", "name", "price", "image", "description", "category", "foodType", "readyTime", "rating", "vendorId"]
            }]
        }) as unknown as VendorAttributes;
      
        return res.status(200).json({
           Vendor
        })
    
    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/vendors/get-vendor-food/:id"
        }) 
    } 
}
import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signInInput,signUPInput } from "@akramsulthan/common";

export const userRoutes=new Hono<{
    Bindings:{
        DATABASE_URL:string;
        JWT_SECRET:string;
    }
}>();

userRoutes.post('/signup',async (c)=>{
    const prisma = new PrismaClient({
       datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate());

  const body=await c.req.json();
  const {success}=signUPInput.safeParse(body);
  console.log(success);
  console.log(body);
  if(!success)
  {
    console.log(success);
     return c.json(
        {
            message:"inputs feilds are incorrect"
        }
     );
  }
  try{
    const res=await prisma.user.create({
      data:{
        name:body.name,
        username:body.username,
        password:body.password,
      }
     })
     const jwt=await sign({
      id:res.id
     },c.env.JWT_SECRET);
     console.log(res);
     return c.json({
        jwt:jwt
     })
  }catch(e){
    console.log(e);
    c.status(411);
    return c.text('user already exist')
  }
  })
  
userRoutes.post('/signin',async(c)=>{
    console.log("coming first");
    const prisma = new PrismaClient({
      datasourceUrl:"prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiOWJjYTdhZWQtOTZjMi00ZmQzLThlYzctN2MyMDExMzgwOGQwIiwidGVuYW50X2lkIjoiYmY4ZmIwNmQzZWJhZWIyY2Q1ODA1NGM2NmVjZWQyNWI3ZDQwNzI2NTIwYmZmOTNkMDYyMDkyMDMwMDBjNDk1NiIsImludGVybmFsX3NlY3JldCI6ImU0NWU1NTU4LTBhNDEtNDM4Mi1hN2VkLTkwMGFkOGMwNTY5NyJ9.dDeTV_r9prPonPgJOaXhZut6LSUalTkyuYUyuZK1JaY"
    }).$extends(withAccelerate())
    const body=await c.req.json();
    const {success}=signInInput.safeParse(body);
    console.log("getting succes");
    if(!success)
    {
      console.log("values in correct");
      return c.text("login values are incorrect");
    }
    try{
      console.log("calling be");
      const res=await prisma.user.findFirst({
        where:{
          username:body.username,
        }
       })
       if(!res){
        c.status(403);
        return c.text("there is no account inthis emailaddress");
       }
       const jwt=await sign({
        id:res.id
       },c.env.JWT_SECRET);
       return c.json({
        data:"your are login",
        jwt:jwt,
       })
    }catch(e){
      console.log("can get");
      console.log(e);
      c.status(411);
      return c.text('user already exist')
    }
  })
  
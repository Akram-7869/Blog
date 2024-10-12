import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import {createBlogInput,updateBlogInput} from "@akramsulthan/common";

export const blogRoutes=new Hono<
{
    Bindings:{
        DATABASE_URL:string;
        JWT_SECRET:string;
    },
    Variables:{
        userId:any;
    }
}>();

blogRoutes.use('/*',async(c,next)=>{
    const authheader=c.req.header("authorization") || "";
    const user=await verify(authheader,c.env.JWT_SECRET);
    if(user){
        c.set("userId",user.id);
        await next();
    }else
    {
        return c.json({
            message:"you are not login "
        })
    }
})

blogRoutes.post('/',async(c)=>{

    console.log("starting ");
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
     }).$extends(withAccelerate())
   const body=await c.req.json();
   const {success}=createBlogInput.safeParse(body);
   if(!success)
   return c.text("give all the values correctly");
   console.log("body ");
   const authorId= c.get("userId");
   try{
    console.log("inside");
    const res= await prisma.blog.create({
        data:{
            title:body.title,
            content:body.content,
            authorId:authorId,
        }
       })
    console.log("finidhing ");
       return c.json({
        message:res,
        id:res.id
       });
   }catch(e)
   { 
        c.json({
            message:"cann't upload blog"
        })
       return c.status(411);
   }
})


blogRoutes.put('/',async(c)=>{
    const prisma = new PrismaClient({
       datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate())
  const body=await c.req.json();
  const {success}=updateBlogInput.safeParse(body);
   if(!success)
   return c.text("give all the values correctly to update");
  try{
   const res= await prisma.blog.update({
       where:{
        id:body.id
       },
       data:{
           title:body.title,
           content:body.content,
       }
      })
      return c.json({
       message:res,
       id:res.id
      });
  }catch(e)
  { 
       c.json({
           message:"cann't update blog"
       })
      return c.status(411);
  }
})
  
blogRoutes.get('/bulk',async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try{
        const blogs=await prisma.blog.findMany({
            select:{
                content:true,
                title:true,
                id:true,
                author:{
                    select:{
                        name:true
                    }
                }
            }
        });

        return c.json({
            blogs
        })
    }catch(e){
        console.log(e);
        return c.text("cant get the bulk blogs" +e);
    }
    
})

blogRoutes.get('/:id',async(c)=>{
    const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
     }).$extends(withAccelerate())
   const id=await c.req.param("id");
   console.log(id);
   try{
    const res= await prisma.blog.findFirst({
        where:{
         id:Number(id)
        },
        select:{
            title:true,
            content:true,
            author:{
                select:{
                    name:true
                }
            }
        }
       })
       console.log(res);
       return c.json({
            res
       });
   }catch(e)
   { 
        console.log(e)
        c.json({
            message:"cann't get the  blog"
        })
       return c.status(411);
   }
})
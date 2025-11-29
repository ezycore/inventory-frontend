"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Avatar, AvatarFallback, AvatarImage } from "@ui/components/avatar";
import { EyeOff } from "lucide-react";
import { Button } from "@/ui/components/button";

export default function ProfilePage() {
 const [image, setImage] = useState("/user.png");
 const [file, setFile] = useState<File | null>(null);

 const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setFile(file);
  setImage(URL.createObjectURL(file));
 };

 return (
  <div className="p-8">
   <Card className="p-6 shadow-sm">
    <h2 className="text-lg font-semibold mb-6">Profile</h2>

    <div className="grid gap-8">
     {/* LEFT PANEL */}
     <div>
      <h3 className="text-sm font-medium mb-4">Basic Information</h3>

      <div className="flex items-center gap-4">
       <Avatar className="w-24 h-24">
        <AvatarImage src={image} />
        <AvatarFallback>JJ</AvatarFallback>
       </Avatar>

       <div>
        <Button type="button" size="sm">
         <label className="cursor-pointer flex items-center gap-2">
          <span>Change Image</span>
          <input
           type="file"
           hidden
           accept="image/png,image/jpeg"
           onChange={handleImageUpload}
          />
         </label>
        </Button>


        <p className="text-sm text-muted-foreground mt-2">
         Upload an image below 2 MB, Accepted format JPG, PNG
        </p>
       </div>
      </div>
     </div>

     {/* FORM SECTION */}
     <div className="grid grid-cols-2 gap-6">
      <FormItem label="First Name">
       <Input defaultValue="Jeffry" />
      </FormItem>

      <FormItem label="Last Name">
       <Input defaultValue="Jordan" />
      </FormItem>

      <FormItem label="Email">
       <Input defaultValue="jeffry@example.com" />
      </FormItem>

      <FormItem label="Phone Number">
       <Input defaultValue="+17468314286" />
      </FormItem>

      <FormItem label="User Name">
       <Input defaultValue="Jeffry Jordan" />
      </FormItem>

      <FormItem label="Password">
       <div className="relative">
        <Input type="password" defaultValue="password123" />
        <EyeOff className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer" />
       </div>
      </FormItem>
     </div>
    </div>

    {/* FOOTER BUTTONS */}
    <div className="mt-8 flex justify-end gap-3">
     <Button variant="outline">Cancel</Button>
     <Button>
      Save Changes
     </Button>
    </div>
   </Card>
  </div>
 );
}

function FormItem({
 label,
 children,
}: {
 label: string;
 children: React.ReactNode;
}) {
 return (
  <div className="flex flex-col gap-2">
   <Label>{label}</Label>
   {children}
  </div>
 );
}

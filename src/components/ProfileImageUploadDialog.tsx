"use client";

import { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, writeBatch } from 'firebase/firestore';
import { useFirestore } from "../firebase";
import { uploadFile } from "../firebase/storage";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { useToast } from "../hooks/use-toast";
import { Upload } from 'lucide-react';

type ProfileImageUploadDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User;
};

export function ProfileImageUploadDialog({
  isOpen,
  onOpenChange,
  user,
}: ProfileImageUploadDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !firestore) return;

    const filePath = `users/${user.uid}/profileImage`;
    setUploadProgress(0);

    try {
        const downloadURL = await uploadFile(file, filePath, setUploadProgress);

        const batch = writeBatch(firestore);
        
        const userRef = doc(firestore, 'users', user.uid);
        batch.update(userRef, { photoURL: downloadURL });
        
        const publicUserRef = doc(firestore, 'publicUsers', user.uid);
        batch.update(publicUserRef, { photoURL: downloadURL });

        await batch.commit();

        toast({
            title: 'Audit Update',
            description: 'Your profile avatar has been clinicaly updated.',
        });
        onOpenChange(false);
        window.location.reload(); 

    } catch (error: any) {
        setUploadProgress(null);
        setFile(null); 
        console.error("Upload failure:", error);
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error.message || "A production storage error occurred.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Profile Image</DialogTitle>
          <DialogDescription>
            Select a new image to use as your production avatar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
          {uploadProgress !== null && <Progress value={uploadProgress} className="w-full" />}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || uploadProgress !== null}>
            <Upload className="mr-2" />
            {uploadProgress !== null ? 'Uploading...' : 'Upload & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

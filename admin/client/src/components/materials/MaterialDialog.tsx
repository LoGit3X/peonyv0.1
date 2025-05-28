import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MaterialForm } from './MaterialForm';

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: any;
  mode: 'add' | 'edit';
}

const MaterialDialog = ({ open, onOpenChange, material, mode }: MaterialDialogProps) => {
  const title = mode === 'add' ? 'افزودن ماده اولیه جدید' : 'ویرایش ماده اولیه';
  const description = mode === 'add' 
    ? 'مشخصات ماده اولیه جدید را وارد کنید' 
    : 'مشخصات ماده اولیه را ویرایش کنید';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2C2F33] border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">{description}</DialogDescription>
        </DialogHeader>
        <MaterialForm 
          material={material} 
          isEditing={mode === 'edit'} 
          onOpenChange={onOpenChange} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default MaterialDialog; 
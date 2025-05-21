'use client';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function AlertLogin() {
  return (
    <>
      <Alert variant='destructive'>
        <AlertCircle className='w-4 h-4' />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>로그인 후 투표할 수 있습니다.</AlertDescription>
      </Alert>
      ;
    </>
  );
}

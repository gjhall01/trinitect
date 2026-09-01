'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoalsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/commitments'); }, [router]);
  return null;
}

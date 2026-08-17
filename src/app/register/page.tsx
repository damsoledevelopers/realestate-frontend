import { Suspense } from 'react';
import RegisterPage from './RegisterPage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <RegisterPage />
    </Suspense>
  );
}

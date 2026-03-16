import { Container } from '@/components/ui/container';
import React from 'react';
import CreateProductPage from './_components/CreateProductPage';

export default function Product() {
  return (
    <Container>
      <div className="space-y-6">
        <CreateProductPage />
      </div>
    </Container>
  );
}

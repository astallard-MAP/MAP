export function generateStaticParams() {
  return [{ id: 'new' }];
}

import ClientPage from './ClientPage';

export default function Page() {
  return <ClientPage />;
}

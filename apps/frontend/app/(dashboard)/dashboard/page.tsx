import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      Dashboard page <Link href={'/logout'}>Logout</Link>
    </div>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RestaurantMenuView } from '@/components/restaurant/restaurant-menu-view';
import { RESTAURANTS, getRestaurant } from '@/data';

export function generateStaticParams() {
  return RESTAURANTS.map((r) => ({ id: r.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const restaurant = getRestaurant(params.id);
  if (!restaurant) return { title: 'Restaurant not found' };
  return { title: `${restaurant.name} — order online`, description: restaurant.tagline };
}

export default function RestaurantPage({ params }: { params: { id: string } }) {
  if (!getRestaurant(params.id)) notFound();
  return <RestaurantMenuView restaurantId={params.id} />;
}

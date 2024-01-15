import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import { type Todo } from '../../../../types/main';

export default function MyMap() {
  const [todos] = useState<Todo[]>([]);

  useEffect(() => {
    (async () => {
      // const { todos: allTodos } = await TodosDb.getAll();
      // setTodos(allTodos);
    })();
  }, []);

  const locatedTodos = useMemo(() => todos.filter((t) => t.location), [todos]);

  return (
    <div id="map-wrapper" className="h-screen max-h-screen">
      <header className="mx-auto my-0 mt-2.5 flex max-w-3xl flex-row items-center border-b-2 px-6 py-2">
        <h1 className="text-xl font-semibold text-primary">maitu</h1>
        <Link
          className="ml-auto mr-5 border-b-2 border-primary px-3 py-0.5 text-base text-primary"
          href="/"
        >
          Back
        </Link>
      </header>
      <div className="flex h-full">
        <div className="max-w-md">
          {locatedTodos.map((todo) => {
            return <div key={todo._id?.toString()}>{todo.title}</div>;
          })}
        </div>
        <MapContainer
          className="h-full grow"
          zoom={4}
          center={{ lat: -14.235004, lng: -51.925282 }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locatedTodos.map((todo) => {
            const [latitude, longitude] = todo.location?.split(',') || [];
            return (
              <Marker key={todo.location} position={[+latitude, +longitude]}>
                <Popup>{todo.title}</Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

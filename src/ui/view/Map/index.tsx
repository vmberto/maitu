import {MapContainer, Marker, TileLayer, Popup} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"
import * as TodosDb from "src/db/todosDb";
import {useEffect, useState} from "react";
import {Todo} from "src/types/main";


export default function MyMap() {
    const [todos, setTodos] = useState<Todo[]>([])

    useEffect(() => {
        (async () => {
            const {todos: allTodos} = await TodosDb.getAll();
            setTodos(allTodos);
        })();
    }, []);


    return (<>
        <header className="flex flex-row max-w-3xl my-0 mx-auto py-2 px-6 mt-2.5 border-b-2 items-center">
            <h1 className="text-primary text-xl font-semibold">Maitu</h1>
            <a
                className="ml-auto mr-5 border-b-2 border-primary text-primary px-3 text-base py-0.5"
                href="/">
                Back
            </a>
        </header>
        <MapContainer className="h-screen" zoom={4} center={{lat: -14.235004, lng: -51.925282}}
                      scrollWheelZoom={false}>
            <TileLayer
                detectRetina={true}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {todos
                .filter(t => t.location)
                .map((todo) => {
                    const [latitude, longitude] = todo.location?.split(',') || [];
                    return <Marker key={todo.location}
                                   position={[+latitude, +longitude]}>
                        <Popup>{todo.title}</Popup>
                    </Marker>
                })}
        </MapContainer>
    </>)
}

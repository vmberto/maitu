import Dropdown from "../components/Dropdown";

interface ListDemoProps {
    onClick?: () => {};
}
export const ListDemo = ({onClick}: ListDemoProps) => {

    return (
        <div onClick={onClick} className="my-2.5
        transition-all cursor-pointer
         border-l-detail border-primary
         bg-white p-6 rounded-md font-semibold items-center
         flex align-middle hover:border-l-detail-hover shadow-sm">
            <h1>Lista 1</h1>
            <div className="ml-auto">
                <Dropdown />
            </div>
        </div>
    )
}

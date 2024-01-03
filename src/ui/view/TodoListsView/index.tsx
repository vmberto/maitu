import {useState} from 'react';
import {ListDemo} from 'src/ui/view/TodoListsView/components/ListDemo';
import AddListSlideOver from 'src/ui/view/TodoListsView/components/AddListSlideOver';
import {useTodoLists} from 'src/hooks/useTodoLists';
import {NewListButton} from "src/ui/view/TodoListsView/components/NewListButton";
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';

const TodoListsView = () => {
    const [open, setOpen] = useState(false);
    const {todoLists, updateTodoListsOrder, handleAddTodoList} = useTodoLists();

    return (
        <>
            <header className="flex flex-row max-w-3xl my-0 mx-auto py-2 px-6 mt-2.5 border-b-2 items-center">
                <h1 className="text-primary text-xl font-semibold">Maitu</h1>
                <a
                    className="ml-auto mr-5 border-b-2 border-primary text-primary px-3 text-base py-0.5"
                    href="/map">
                    Map
                </a>
            </header>
            <div className="max-w-2xl mt-0 mb-60 mx-auto p-5">
                <DragDropContext onDragEnd={updateTodoListsOrder}>
                    <Droppable droppableId="droppable-list">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                {todoLists.map((list, index) => (
                                    <Draggable
                                        key={list.id}
                                        draggableId={`${list.id}`}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={provided.draggableProps.style}
                                                className="mb-2">
                                                <ListDemo key={list.id} todoList={list}/>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <NewListButton onClick={() => setOpen(true)}/>
            </div>

            <AddListSlideOver
                title="Add List"
                open={open}
                setOpen={setOpen}
                handleAddTodoList={handleAddTodoList}
            />
        </>
    );
};

export default TodoListsView;

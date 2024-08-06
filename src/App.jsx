import {useEffect, useState} from 'react'
import Board from '../components/Board/Board'
import Navbar from '../components/Navbar/Navbar'
import './App.css'
// import data from '../data'
import {DragDropContext} from 'react-beautiful-dnd'
import useLocalStorage from 'use-local-storage'
import {v4 as uuidv4} from 'uuid'
import '../bootstrap.css'
import Editable from '../components/Editable/Editable'

const BaseURL = 'https://52vcdrgahh.execute-api.us-east-1.amazonaws.com/prod'

function App() {
	const [data, setData] = useState(
		localStorage.getItem('kanban-board')
			? JSON.parse(localStorage.getItem('kanban-board'))
			: []
	)

	useEffect(() => {
		fetch(`${BaseURL}/get-boards`)
			.then((res) => res.json())
			.then((data) => {
				console.log(data)
			})
			.catch((err) => console.log(err))
	}, [])

	const defaultDark = window.matchMedia('(prefers-colors-scheme: dark)').matches
	const [theme, setTheme] = useLocalStorage(
		'theme',
		defaultDark ? 'dark' : 'light'
	)

	const switchTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light')
	}

	const setName = (title, bid) => {
		const index = data.findIndex((item) => item.id === bid)
		const tempData = [...data]
		tempData[index].boardName = title

		fetch(`${BaseURL}/update-board`, {
			method: 'POST',
			body: JSON.stringify({
				new_name: title,
				board_id: bid,
			}),
		})
			.then((res) => res.json())
			.then((data) => console.log(data))
			.catch((err) => console.log(err))

		setData(tempData)
	}

	const dragCardInBoard = (source, destination) => {
		let tempData = [...data]
		const destinationBoardIdx = tempData.findIndex(
			(item) => item.id.toString() === destination.droppableId
		)
		const sourceBoardIdx = tempData.findIndex(
			(item) => item.id.toString() === source.droppableId
		)
		tempData[destinationBoardIdx].card.splice(
			destination.index,
			0,
			tempData[sourceBoardIdx].card[source.index]
		)
		tempData[sourceBoardIdx].card.splice(source.index, 1)

		fetch(`${BaseURL}/move-card`, {
			method: 'POST',
			body: JSON.stringify({
				card_id: tempData[destinationBoardIdx].card[destination.index].id,
				new_board_id: tempData[destinationBoardIdx].id,
			}),
		})
			.then((res) => res.json())
			.then((data) => console.log(data))
			.catch((err) => console.log(err))

		return tempData
	}

	const addCard = (title, bid) => {
		const index = data.findIndex((item) => item.id === bid)
		const tempData = [...data]
		let id = uuidv4()
		tempData[index].card.push({
			id: id,
			title: title,
			tags: [],
			task: [],
		})
		fetch(`${BaseURL}/add-card`, {
			method: 'POST',
			body: JSON.stringify({
				board_id: bid,
				title: title,
				card_id: id,
			}),
		})
			.then((res) => res.json())
			.then((data) => console.log(data))
			.catch((err) => console.log(err))

		setData(tempData)
	}

	const removeCard = (boardId, cardId) => {
		const index = data.findIndex((item) => item.id === boardId)
		const tempData = [...data]
		const cardIndex = data[index].card.findIndex((item) => item.id === cardId)

		tempData[index].card.splice(cardIndex, 1)

		fetch(`${BaseURL}/delete-card`, {
			method: 'POST',
			body: JSON.stringify({
				card_id: cardId,
			}),
		})
			.then((res) => res.json())
			.then((data) => console.log(data))
			.catch((err) => console.log(err))

		setData(tempData)
	}

	const addBoard = (title) => {
		const tempData = [...data]
		let id = uuidv4()
		tempData.push({
			id: id,
			boardName: title,
			card: [],
		})
		fetch(`${BaseURL}/add-board`, {
			method: 'POST',
			body: JSON.stringify({
				board_name: title,
				id: id,
			}),
		})
			.then((res) => res.json())
			.then((data) => console.log(data))
			.catch((err) => console.log(err))
		setData(tempData)
	}

	const removeBoard = (bid) => {
		const tempData = [...data]
		const index = data.findIndex((item) => item.id === bid)
		tempData.splice(index, 1)
		fetch(`${BaseURL}/delete-board`, {
			method: 'POST',
			body: JSON.stringify({
				board_id: bid,
			}),
		})
			.then((res) => res.json())
			.then((data) => console.log(data))
			.catch((err) => console.log(err))

		setData(tempData)
	}

	const onDragEnd = (result) => {
		const {source, destination} = result
		if (!destination) return

		if (source.droppableId === destination.droppableId) return

		setData(dragCardInBoard(source, destination))
	}

	const updateCard = (bid, cid, card) => {
		const index = data.findIndex((item) => item.id === bid)
		if (index < 0) return

		const tempBoards = [...data]
		const cards = tempBoards[index].card

		const cardIndex = cards.findIndex((item) => item.id === cid)
		if (cardIndex < 0) return

		tempBoards[index].card[cardIndex] = card
		// console.log(tempBoards)

		fetch(`${BaseURL}/update-card`, {
			method: 'POST',
			body: JSON.stringify({
				card_id: cid,
				title: card.title,
				tags: card.tags,
				task: card.task,
			}),
		})
			.then((res) => res.json())
			.then((data) => console.log(data))
			.catch((err) => console.log(err))

		setData(tempBoards)
	}

	useEffect(() => {
		localStorage.setItem('kanban-board', JSON.stringify(data))
	}, [data])

	return (
		<DragDropContext onDragEnd={onDragEnd}>
			<div className="App" data-theme={theme}>
				<Navbar switchTheme={switchTheme} />
				<div className="app_outer">
					<div className="app_boards">
						{data.map((item) => (
							<Board
								key={item.id}
								id={item.id}
								name={item.boardName}
								card={item.card}
								setName={setName}
								addCard={addCard}
								removeCard={removeCard}
								removeBoard={removeBoard}
								updateCard={updateCard}
							/>
						))}
						<Editable
							class={'add__board'}
							name={'Add Board'}
							btnName={'Add Board'}
							onSubmit={addBoard}
							placeholder={'Enter Board  Title'}
						/>
					</div>
				</div>
			</div>
		</DragDropContext>
	)
}

export default App

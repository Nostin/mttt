import React, {Component} from 'react'

import io from 'socket.io-client'

import TweenMax from 'gsap'

import rand_arr_elem from '../../helpers/rand_arr_elem'
import rand_to_fro from '../../helpers/rand_to_fro'

export default class SetName extends Component {

	constructor (props) {
		super(props)

		this.win_sets = [
			['c1', 'c2', 'c3'],
			['c4', 'c5', 'c6'],
			['c7', 'c8', 'c9'],

			['c1', 'c4', 'c7'],
			['c2', 'c5', 'c8'],
			['c3', 'c6', 'c9'],

			['c1', 'c5', 'c9'],
			['c3', 'c5', 'c7']
		]


		if (this.props.game_type != 'live')
			this.state = {
				cell_vals: {},
				next_turn_ply: true,
				game_play: true,
				game_stat: 'Start game',
				game_completed: false,
				rematch_requested: false,
				rematch_accepted: false,
				opponent_disconnected: false,
				opponent_name: null,
				game_streak: []
			}
		else {
			this.sock_start()

			this.state = {
				cell_vals: {},
				next_turn_ply: true,
				game_play: false,
				game_stat: 'Connecting',
				game_completed: false,
				rematch_requested: false,
				rematch_accepted: false,
				opponent_disconnected: false,
				opponent_name: null,
				game_streak: []
			}
		}
	}

//	------------------------	------------------------	------------------------

	componentDidMount () {
    	TweenMax.from('#game_stat', 1, {display: 'none', opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeIn})
    	TweenMax.from('#game_board', 1, {display: 'none', opacity: 0, x:-200, y:-200, scaleX:0, scaleY:0, ease: Power4.easeIn})
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	sock_start () {

		this.socket = io(app.settings.ws_conf.loc.SOCKET__io.u);

		this.socket.on('connect', function(data) { 
			// console.log('socket connected', data)

			this.socket.emit('new player', { name: app.settings.curr_user.name });

		}.bind(this));

		this.socket.on('pair_players', function(data) { 
			// console.log('paired with ', data)

			// Check if this is a rematch or new opponent
			const isRematch = this.state.opponent_name === data.opp.name && this.state.game_streak.length > 0
			
			this.setState({
				next_turn_ply: data.mode=='m',
				game_play: true,
				game_stat: 'Playing with ' + data.opp.name,
				game_completed: false,
				rematch_requested: false,
				rematch_accepted: false,
				opponent_disconnected: false,
				opponent_name: data.opp.name,
				game_streak: isRematch ? this.state.game_streak : [] // Only reset streak for new opponents
			})

		}.bind(this));


		this.socket.on('opp_turn', this.turn_opp_live.bind(this));

		// Add rematch event handlers
		this.socket.on('rematch_request', this.onRematchRequest.bind(this));
		this.socket.on('rematch_accepted', this.onRematchAccepted.bind(this));
		this.socket.on('rematch_rejected', this.onRematchRejected.bind(this));
		this.socket.on('opponent_disconnected', this.onOpponentDisconnected.bind(this));


	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	componentWillUnmount () {

		this.socket && this.socket.disconnect();
	}

//	------------------------	------------------------	------------------------

	cell_cont (c) {
		const { cell_vals } = this.state

		return (<div>
		        	{cell_vals && cell_vals[c]=='x' && <i className="fa fa-times fa-5x"></i>}
					{cell_vals && cell_vals[c]=='o' && <i className="fa fa-circle-o fa-5x"></i>}
				</div>)
	}

//	------------------------	------------------------	------------------------

	render () {
		const { cell_vals, game_completed, rematch_requested, rematch_accepted, opponent_disconnected, game_streak } = this.state
		// console.log(cell_vals)

		return (
			<div id='GameMain'>

				<h1>Play {this.props.game_type}</h1>

				<div id="game_stat">
					<div id="game_stat_msg">{this.state.game_stat}</div>
					{this.state.game_play && <div id="game_turn_msg">{this.state.next_turn_ply ? 'Your turn' : 'Opponent turn'}</div>}
				</div>

				<div id="game_board">
					<table>
					<tbody>
						<tr>
							<td id='game_board-c1' ref='c1' onClick={this.click_cell.bind(this)}> {this.cell_cont('c1')} </td>
							<td id='game_board-c2' ref='c2' onClick={this.click_cell.bind(this)} className="vbrd"> {this.cell_cont('c2')} </td>
							<td id='game_board-c3' ref='c3' onClick={this.click_cell.bind(this)}> {this.cell_cont('c3')} </td>
						</tr>
						<tr>
							<td id='game_board-c4' ref='c4' onClick={this.click_cell.bind(this)} className="hbrd"> {this.cell_cont('c4')} </td>
							<td id='game_board-c5' ref='c5' onClick={this.click_cell.bind(this)} className="vbrd hbrd"> {this.cell_cont('c5')} </td>
							<td id='game_board-c6' ref='c6' onClick={this.click_cell.bind(this)} className="hbrd"> {this.cell_cont('c6')} </td>
						</tr>
						<tr>
							<td id='game_board-c7' ref='c7' onClick={this.click_cell.bind(this)}> {this.cell_cont('c7')} </td>
							<td id='game_board-c8' ref='c8' onClick={this.click_cell.bind(this)} className="vbrd"> {this.cell_cont('c8')} </td>
							<td id='game_board-c9' ref='c9' onClick={this.click_cell.bind(this)}> {this.cell_cont('c9')} </td>
						</tr>
					</tbody>
					</table>
				</div>

				{game_streak.length > 0 && (
					<div id="game_streak">
						<div id="streak_label">Streak:</div>
						<div id="streak_results">
							{game_streak.map((result, index) => (
								<span key={index} className={`streak-result ${result.toLowerCase()}`}>
									{result}
								</span>
							))}
						</div>
					</div>
				)}

				<div id="game_controls">
					{game_completed && this.props.game_type != 'live' && (
						<button type='button' onClick={this.handleRematch.bind(this)} className='button rematch-btn'>
							<span>Rematch <span className='fa fa-refresh'></span></span>
						</button>
					)}
					
					{game_completed && this.props.game_type == 'live' && !opponent_disconnected && !rematch_requested && !rematch_accepted && (
						<button type='button' onClick={this.handleRematch.bind(this)} className='button rematch-btn'>
							<span>Rematch <span className='fa fa-refresh'></span></span>
						</button>
					)}
					
					{game_completed && this.props.game_type == 'live' && !opponent_disconnected && rematch_requested && !rematch_accepted && (
						<button type='button' disabled className='button rematch-btn disabled'>
							<span>Rematch Requested <span className='fa fa-clock-o'></span></span>
						</button>
					)}
					
					{game_completed && this.props.game_type == 'live' && !opponent_disconnected && rematch_accepted && (
						<button type='button' onClick={this.handleAcceptRematch.bind(this)} className='button accept-btn'>
							<span>Accept Rematch <span className='fa fa-check'></span></span>
						</button>
					)}

					<button type='submit' onClick={this.end_game.bind(this)} className='button'><span>End Game <span className='fa fa-caret-right'></span></span></button>
				</div>

			</div>
		)
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	click_cell (e) {
		// console.log(e.currentTarget.id.substr(11))
		// console.log(e.currentTarget)

		if (!this.state.next_turn_ply || !this.state.game_play) return

		const cell_id = e.currentTarget.id.substr(11)
		if (this.state.cell_vals[cell_id]) return

		if (this.props.game_type != 'live')
			this.turn_ply_comp(cell_id)
		else
			this.turn_ply_live(cell_id)
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	turn_ply_comp (cell_id) {

		let { cell_vals } = this.state

		cell_vals[cell_id] = 'x'

		TweenMax.from(this.refs[cell_id], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})


		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: false
		// })

		// setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

		this.state.cell_vals = cell_vals

		this.check_turn()
	}

//	------------------------	------------------------	------------------------

	turn_comp () {

		let { cell_vals } = this.state
		let empty_cells_arr = []


		for (let i=1; i<=9; i++) 
			!cell_vals['c'+i] && empty_cells_arr.push('c'+i)
		// console.log(cell_vals, empty_cells_arr, rand_arr_elem(empty_cells_arr))

		const c = rand_arr_elem(empty_cells_arr)
		cell_vals[c] = 'o'

		TweenMax.from(this.refs[c], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})


		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: true
		// })

		this.state.cell_vals = cell_vals

		this.check_turn()
	}


//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	turn_ply_live (cell_id) {

		let { cell_vals } = this.state

		cell_vals[cell_id] = 'x'

		TweenMax.from(this.refs[cell_id], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})

		this.socket.emit('ply_turn', { cell_id: cell_id });

		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: false
		// })

		// setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

		this.state.cell_vals = cell_vals

		this.check_turn()
	}

//	------------------------	------------------------	------------------------

	turn_opp_live (data) {

		let { cell_vals } = this.state
		let empty_cells_arr = []


		const c = data.cell_id
		cell_vals[c] = 'o'

		TweenMax.from(this.refs[c], 0.7, {opacity: 0, scaleX:0, scaleY:0, ease: Power4.easeOut})


		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: true
		// })

		this.state.cell_vals = cell_vals

		this.check_turn()
	}

//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------
//	------------------------	------------------------	------------------------

	check_turn () {

		const { cell_vals } = this.state

		let win = false
		let set
		let fin = true

		if (this.props.game_type!='live')
			this.state.game_stat = 'Play'


		for (let i=0; !win && i<this.win_sets.length; i++) {
			set = this.win_sets[i]
			if (cell_vals[set[0]] && cell_vals[set[0]]==cell_vals[set[1]] && cell_vals[set[0]]==cell_vals[set[2]])
				win = true
		}


		for (let i=1; i<=9; i++) 
			!cell_vals['c'+i] && (fin = false)

		// win && console.log('win set: ', set)

		if (win) {
		
			this.refs[set[0]].classList.add('win')
			this.refs[set[1]].classList.add('win')
			this.refs[set[2]].classList.add('win')

			TweenMax.killAll(true)
			TweenMax.from('td.win', 1, {opacity: 0, ease: Linear.easeIn})

			// Determine result for streak
			const isPlayerWin = cell_vals[set[0]] == 'x'
			const newStreak = [...this.state.game_streak, isPlayerWin ? 'W' : 'L']

			this.setState({
				game_stat: (cell_vals[set[0]]=='x'?'You':'Opponent')+' win',
				game_play: false,
				game_completed: true,
				game_streak: newStreak
			})

			// Don't disconnect socket for live games - needed for rematch
			if (this.props.game_type != 'live') {
				this.socket && this.socket.disconnect();
			}

		} else if (fin) {
		
			// Add draw to streak
			const newStreak = [...this.state.game_streak, 'D']

			this.setState({
				game_stat: 'Draw',
				game_play: false,
				game_completed: true,
				game_streak: newStreak
			})

			// Don't disconnect socket for live games - needed for rematch
			if (this.props.game_type != 'live') {
				this.socket && this.socket.disconnect();
			}

		} else {
			this.props.game_type!='live' && this.state.next_turn_ply && setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

			this.setState({
				next_turn_ply: !this.state.next_turn_ply
			})
		}
		
	}


//	------------------------	------------------------	------------------------
	handleRematch () {
		if (this.props.game_type != 'live') {
			// Computer opponent - start new game immediately
			this.startNewGame()
		} else {
			// Live opponent - request rematch
			this.socket.emit('rematch_request', {});
			this.setState({
				rematch_requested: true,
				game_stat: 'Rematch requested...'
			})
		}
	}

	handleAcceptRematch () {
		this.socket.emit('rematch_accepted', {});
		this.startNewGame()
	}

	startNewGame (resetStreak = false) {
		// Reset game state
		const newState = {
			cell_vals: {},
			next_turn_ply: true,
			game_play: this.props.game_type != 'live',
			game_stat: this.props.game_type != 'live' ? 'Start game' : 'Playing with ' + (this.state.opponent_name || 'Opponent'),
			game_completed: false,
			rematch_requested: false,
			rematch_accepted: false,
			opponent_disconnected: false
		}

		// Only reset streak if explicitly requested (for new opponents)
		if (resetStreak) {
			newState.game_streak = []
		}

		this.setState(newState)

		// Clear win highlighting
		for (let i = 1; i <= 9; i++) {
			const cellRef = this.refs['c' + i]
			if (cellRef) {
				cellRef.classList.remove('win')
			}
		}

		// For live games, emit that we're ready for new game
		if (this.props.game_type == 'live') {
			this.socket.emit('new_game_ready', {});
		}
	}

	onRematchRequest (data) {
		this.setState({
			rematch_accepted: true,
			opponent_name: data.opponent_name,
			game_stat: 'Rematch requested by ' + data.opponent_name
		})
	}

	onRematchAccepted (data) {
		this.startNewGame()
	}

	onRematchRejected (data) {
		this.setState({
			rematch_requested: false,
			game_stat: 'Rematch declined'
		})
	}

	onOpponentDisconnected (data) {
		this.setState({
			game_stat: 'Opponent disconnected',
			game_play: false,
			game_completed: true,
			rematch_requested: false,
			rematch_accepted: false,
			opponent_disconnected: true
		})
	}

//	------------------------	------------------------	------------------------

	end_game () {
		this.socket && this.socket.disconnect();

		this.props.onEndGame()
	}



}

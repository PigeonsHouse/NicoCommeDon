import { useEffect, useState } from 'react';
import Mastodon, { StreamingAPIConnection } from 'mastodon-api';
import style from '../styles/comment.module.css'
import { NextRouter, useRouter } from 'next/router';

const selectURL = (process.env.NODE_ENV === 'production') ? 'app://./select.html' : '/select'
let comments: Array<JSX.Element> = [];

function Comment() {
	const router: NextRouter = useRouter();
	let mstdn = null;
	let isGetInstance: boolean = false;
	let childWindow: Window;
	const usableCommandList: Array<string> = [
		'/invisible',
		'/ue',
		'/shita',
		'/big',
		'/small',
		'/red',
		'/pink',
		'/orange',
		'/yellow',
		'/green',
		'/cyan',
		'/blue',
		'/purple',
		'/black'
	];
	const usablePositionCommandList: Array<string> = usableCommandList.slice(1, 3);
	const usableSizeCommandList: Array<string> = usableCommandList.slice(3, 5);
	const usableColorCommandList: Array<string> = usableCommandList.slice(5);
	const sizeList = {
		'/big': '32px',
		'/small': '18px'
	}
	const colorCodes = {
		'/red': '#FF0000',
		'/pink': '#FF8080',
		'/orange': '#FFC000',
		'/yellow': '#FFFF00',
		'/green': '#00FF00',
		'/cyan': '#00FFFF',
		'/blue': '#0000FF',
		'/purple': '#C000FF',
		'/black': '#000000'
	}
	const styleList = {
		'/naka': style.middle,
		'/ue': style.lock,
		'/shita': style.lock
	}
	let currentTopLine = 0;
	let currentBottomLine = 0;
	const [listener, setListener] = useState<StreamingAPIConnection>();
	const [isStreaming, setStreaming] = useState<boolean>(false);
	const [appearHint, setAppearHint] = useState<boolean>(true);
	const [tlName, setTLName] = useState<string>('none');
	const [commentCount, setCommentCount] = useState<number>(0);

	if(router.query.token && router.query.url){
		try{
			mstdn = new Mastodon({
				access_token:router.query.token,
				api_url: router.query.url + '/api/v1'
			});
			isGetInstance = true;
		}catch(err){
			console.error(err);
		}
	}

	const getKeyDown = (e) => {
		if(e.ctrlKey && e.altKey){
			let localTLName;
			let tootMessage;
			let res = false;
			switch(e.code){
				case 'KeyG':
					if(childWindow) childWindow = childWindow.closed ? null : childWindow;
					if(!childWindow) childWindow = window.open(selectURL, 'nico-comme-don', 'width=800,height=600');
					break;
				case 'KeyH':
					setAppearHint(!appearHint);
					break;
				case 'KeyL':
					tootMessage = "ローカルタイムラインの監視を開始します。";
					localTLName = 'public/local';
					break;
				case 'KeyP':
					tootMessage = "公開タイムラインの監視を開始します。";
					localTLName = 'public';
					break;
				case 'KeyU':
					tootMessage = "ホームタイムラインの監視を開始します。";
					localTLName = 'user';
					break;
				case 'KeyS':
					tootMessage = "監視を終了します。";
					localTLName = 'none';
					break;
			}
			if(localTLName){
				res = window.confirm(tootMessage+"\nよろしいでしょうか？");
				if(res){
					setTLName(localTLName);
					if(localTLName === 'none'){
						streamStop();
					}else{
						mstdn.post('/statuses', {status: tootMessage})
						streamStart('/streaming/' + localTLName);
					}
				}
			}
		}
	}

	const streamStart = (streamURL: string) => {
		isStreaming ? streamStop() : null
		setListener(mstdn.stream(streamURL));
		setStreaming(true);
	}

	const streamStop = () => {
		console.log(isStreaming);
		console.log(listener);
		if(isStreaming){
			if (listener !== undefined){
				console.log("stop");
				listener.stop();
			}
		}
	}
	
	const getCommandList = (content: string) => {
		let contentList = content.split(/ |　/);
		let commandList = [];
		contentList.map(contentWord => {
			if(usableCommandList.includes(contentWord) && !commandList.includes(contentWord))
				commandList.push(contentWord)
		})
		return commandList;
	}

	const deleteCommand = (content: string) => {
		let commandList = getCommandList(content);
		let deletingContent = content;
		commandList.map(command => {
			deletingContent = deletingContent.replaceAll(command, '');
		})
		return deletingContent;
	}

	const commentTemplate = (msg) => {
		let content = deleteCommand(rewrite(msg.data.content));
		if (content.trim().length == 0) {
			return
		}
		let commandList = getCommandList(rewrite(msg.data.content));
		let position = '/naka';
		let size = '24px';
		let colorCode = '#FFFFFF';
		commandList.map(command => {
			if(usablePositionCommandList.includes(command) && position == '/naka')
				position = command
			if(usableSizeCommandList.includes(command) && size == '24px')
				size = sizeList[command]
			if(usableColorCommandList.includes(command) && colorCode == '#FFFFFF')
				colorCode = colorCodes[command]
		})
		let stylesheet = styleList[position]
		let nowColumn;
		switch(position){
			case '/naka':
				nowColumn = getRandomInt(11);
				break;
			case '/ue':
				nowColumn = currentTopLine;
				currentTopLine++;
				window.setTimeout(() => {currentTopLine--}, 10000);
				break;
			case '/shita':
				nowColumn = 10 - currentBottomLine;
				
				currentBottomLine++;
				window.setTimeout(() => {currentBottomLine--}, 10000);
				break;
		}
		return (
			<div 
				key={msg.data.id}
			>
				<div 
					className={style.comment + ' ' + stylesheet}
					style={{marginTop: String(nowColumn * 5)+`%`}}
				>
					<p className={style.p_comment+' '+style.content} style={{
						fontSize: size
					}}>
						<img src={msg.data.account.avatar} alt="icon" width="35px" height="35px" style={{borderRadius: `5px`}}></img>
						<span style={{
							color: colorCode,
							fontWeight: 'bold'
						}}>
							{content}
						</span>
					</p>
					<p className={style.p_comment+' '+style.user} style={{
						color: colorCode
					}}>
						{getName(msg.data.account)}
					</p>
				</div>
			</div>
		)
	}

	const getRandomInt = (max: number) => {
		return Math.floor(Math.random() * Math.floor(max));
	}

	const rewrite = (txt: string) => {
        let edit_txt = txt.replaceAll('</p><p>', ' ').replaceAll('<br />', ' ')
		const e = document.createElement('div');
		e.innerHTML = edit_txt;
		return e.innerText;
	}

	const getName = (account) => {
		return account.display_name.length ? account.display_name : account.username;
	}

	if(isGetInstance){
		useEffect(() => {
				window.addEventListener('keydown', getKeyDown);
				return () => {
					window.removeEventListener('keydown', getKeyDown);
				}
		}, [getKeyDown]);
	}

	async function setVideo(message) {
		if(childWindow){
			childWindow.close();
			childWindow == null;
		}
		let windowId = message.data;
		if(windowId === 'keep-id') return;
		if(windowId === null) {
			removeStream();
			return;
		}
		try{
			const stream = await (navigator.mediaDevices as any).getUserMedia({
				audio: false,
				video: {
					mandatory: {
						chromeMediaSource: 'desktop',
						chromeMediaSourceId: windowId,
						minWidth: 1280,
						maxWidth: 1280,
						minHeight: 720,
						maxHeight: 720,
					},
				}
			});
			handleStream(stream);
			return;
		}catch(err){
			console.error(err);
		}
	}

	const handleStream = (stream: MediaProvider) => {
		const video = document.querySelector('video');
		video.srcObject = stream;
		video.onsuspend = () => {
			removeStream();
		}
		video.onloadedmetadata = (e) => {
			video.play();
		}
	}

	const removeStream = () => {
		const video = document.querySelector('video');
		if (video.srcObject != null) {
			(video.srcObject as MediaStream).getVideoTracks().forEach(track => {
				track.stop();
				(video.srcObject as MediaStream).removeTrack(track);
			});
		}
		video.srcObject = null;
	}

	const close = () => {
		console.log("close");
		if(childWindow){
			childWindow.close();
			childWindow == null;
		}
		window.close();
	}


	useEffect(()=>{
		window.addEventListener('message', setVideo);
		return () => {
			window.removeEventListener('message', setVideo)
		}
	},[setVideo])

	useEffect(() => {
		if(listener !== undefined){	
			listener.on('message', (msg) => {
				try{
					let commandList = [];
					if(msg.event === 'update'){
						commandList = getCommandList(rewrite(msg.data.content));
					}
					if(msg.event === 'update' && rewrite(msg.data.content) && !commandList.includes('/invisible')){
						let comment: JSX.Element = commentTemplate(msg);
						comments.push(comment);
						setCommentCount((commentCount)=> commentCount+1 );
					}
				}catch(err){
					console.error(err);
					streamStop();
				}
			})
		}
	}, [listener])


	return (
		isGetInstance ? (
			<>
				<video autoPlay playsInline className={style.videoWrapper} />
				<div className={style.screen}>
					{comments.map((comment) => {
						return comment;
					})}
					{appearHint ? (
						<>
							<small key="timelineInfo" className={style.timelineName}>Timeline: {tlName.slice(tlName.indexOf('/')+1)}</small>
							<p className={style.close} onClick={close}>×</p>
							<div key="help" className={style.helpText}>
								<small>Ctrl+Alt+P: 公開タイムラインの監視</small><br />
								<small>Ctrl+Alt+U: ホームタイムラインの監視</small><br />
								<small>Ctrl+Alt+L: ローカルタイムラインの監視</small><br />
								<small>Ctrl+Alt+S: 監視の終了</small><br />
								<small>Ctrl+Alt+G: 下に置くウィンドウの選択</small><br />
								<small>Ctrl+Alt+H: ヒントの表示/非表示</small><br />
							</div>
						</>
					) : (<></>)}
				</div>
			</>
		) : (
			<></>
		)
	)
}

export default Comment;
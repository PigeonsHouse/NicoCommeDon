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
	// let listener;
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
			}
			if(localTLName){
				res = window.confirm(tootMessage+"\nよろしいでしょうか？");
				if(res){
					mstdn.post('/statuses', {status: tootMessage})
					setTLName(localTLName);
					streamStart('/streaming/' + localTLName);
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
	
	const commentTemplate = (msg) => {
		return (
			<div key={msg.data.id} 
			style={{marginTop: String(getRandomInt(11) * 5)+`%`}} 
			className={style.comment}>
				<p className={style.p_comment+' '+style.content}>
					<img src={msg.data.account.avatar} alt="icon" width="35px" height="35px" style={{borderRadius: `5px`}}></img>{rewrite(msg.data.content)}
				</p>
				<p className={style.p_comment+' '+style.user}>{getName(msg.data.account)}</p>
			</div>
		)
	}

	const getRandomInt = (max: number) => {
		return Math.floor(Math.random() * Math.floor(max));
	}

	const rewrite = (txt: string) => {
		const e = document.createElement('div');
		e.innerHTML = txt;
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
			handleStream(null);
		}
		video.onloadedmetadata = (e) => {
			video.play();
		}
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
					if(msg.event === 'update' && rewrite(msg.data.content)){
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
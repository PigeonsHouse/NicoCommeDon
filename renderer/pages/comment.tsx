import React, { useEffect, useState } from 'react';
import Mastodon from 'mastodon-api';
import { useRouter } from 'next/router';
import { HTMLElementEvent } from '../interfaces';

let comments: Array<JSX.Element> = [];
let mstdn;
let isGetMastodon: boolean = true;

function Comment() {
	const router = useRouter();
	if(router.query.token && router.query.url){
		try{
			mstdn = new Mastodon({
				access_token: router.query.token,
				api_url: router.query.url + '/api/v1/',
			})
		}catch(err){
			isGetMastodon = false;
		}
	}else{
		isGetMastodon = false;
	}
	const helptext = (
		<div key="123" className="helptext">
		<small>Ctrl+Alt+P: 公開タイムラインの監視</small><br />
		<small>Ctrl+Alt+U: ホームタイムラインの監視</small><br />
		<small>Ctrl+Alt+L: ローカルタイムラインの監視</small><br />
		<small>Ctrl+Alt+G: 下に置くウィンドウの選択</small><br />
		<small>Ctrl+Alt+H: ヒントの表示/非表示</small><br />
		<small>Alt+F4: ウィンドウを閉じる</small><br />
		</div>
	)
	const [isStreaming, setStreaming] = useState<boolean>(false);
	const [isDisplayHint, setDisplayHint] = useState<boolean>(true);
	const [tlName, setTLName] = useState<string>("none");
	const [hintPocket, setHintPocket] = useState<Array<JSX.Element>>([helptext]);
	const [timelineView, SetTLView] = useState<Array<JSX.Element>>([(
		<small key="456" className="timelinename">Timeline: none</small>
	)]);
	const [commentCnt, setCommentCnt] = useState<number>(0);
	let listener;
	const mediaDevices = navigator.mediaDevices as any;
	let childWindow;

	const handleStream = (stream) => {
		const video = document.querySelector('video')
		video.srcObject = stream
		video.onsuspend = () => {
			handleStream(null)
		};
		video.onloadedmetadata = (e) => {
			console.log(e)
			video.play()
		}
	}

	const chooseTimeLine = (e: HTMLElementEvent<HTMLInputElement>) => {
		if(e.ctrlKey && e.altKey && e.code === 'KeyG'){
			if (!childWindow)
				childWindow = window.open('/select');
		}
		if(e.ctrlKey && e.altKey && e.code === 'KeyL'){
			alert("ローカルタイムラインの監視を開始します")
			streamStart('streaming/public/local')
			setTLName("local");
			if(isDisplayHint){
				SetTLView([(
					<small key="456" className="timelinename">Timeline: local</small>
				)])
			}
		}
		if(e.ctrlKey && e.altKey && e.code === 'KeyP'){
			alert("パブリックタイムラインの監視を開始します")
			streamStart('streaming/public')
			setTLName("public");
			if(isDisplayHint){
				SetTLView([(
					<small key="456" className="timelinename">Timeline: public</small>
				)])
			}
		}
		if(e.ctrlKey && e.altKey && e.code === 'KeyU'){
			alert("ホームタイムラインの監視を開始します")
			streamStart('streaming/user')
			setTLName("user");
			if(isDisplayHint){
				SetTLView([(
					<small key="456" className="timelinename">Timeline: user</small>
				)])
			}
		}
		if(e.ctrlKey && e.altKey && e.code === 'KeyH'){
			if(isDisplayHint){
				setDisplayHint(false);
				setHintPocket([]);
				SetTLView([]);
			}else{
				setDisplayHint(true)
				setHintPocket([helptext]);
				if(tlName === "local"){
					SetTLView([(
						<small key="456" className="timelinename">Timeline: local</small>
					)])
				}else if(tlName === "public"){
					SetTLView([(
						<small key="456" className="timelinename">Timeline: public</small>
					)])
				}else if(tlName === "user"){
					SetTLView([(
						<small key="456" className="timelinename">Timeline: user</small>
					)])
				}else if(tlName === "none"){
					SetTLView([(
						<small key="456" className="timelinename">Timeline: none</small>
					)])
				}else{
					SetTLView([(
						<small key="456" className="timelinename">Timeline: error</small>
					)])
				}
			}
		}
	}

	const getRandomInt: (max: number) => number = (max: number) => {
		return Math.floor(Math.random() * Math.floor(max));
	}

	const rewrite: (str: string) => string = (txt: string) => {
		const e = document.createElement('div')
		e.innerHTML = txt
		return e.innerText
	}

	const getName = (account) => {
		if(account.display_name.length){
			return account.display_name;
		} else {
			return account.username;
		}
	}

	const streamStart = (streamURL: string) => {
		console.log('Start streaming');
		console.log(mstdn);
		listener = mstdn.stream(streamURL);
		setStreaming(true);
		listener.on('message', (msg) => {
			try{
				if (msg.event === "update"){
					if(rewrite(msg.data.content).length === 0){
						return;
					}else{
						let newtoot: String = rewrite(msg.data.content);
						let account = getName(msg.data.account);
						let comment: JSX.Element = (
							<div key={msg.data.id} 
							style={{marginTop: String(getRandomInt(11) * 5)+`%`}} 
							className="comment">
								<p className="p_comment" id="content">
									<img src={msg.data.account.avatar} alt="icon" width="35px" height="35px" style={{borderRadius: `5px`}}></img>{newtoot}
								</p>
								<p className="p_comment" id="user">{account}</p>
							</div>
						)
						console.log("old comments: ", comments);
						comments = [...comments, comment];
						setCommentCnt( (commentCnt) => commentCnt+1 );
						console.log("new comments: ", comments);
					}
				}
			} catch(err) {
				console.error(err);
				streamStop();
			}
		})
	}

	if(isGetMastodon){
		useEffect(() => {
				window.addEventListener('keydown', chooseTimeLine);
				return () => {
					window.removeEventListener('keydown', chooseTimeLine);
				}
		}, [chooseTimeLine]);
	}

	const streamStop = () => {
		if(isStreaming){
			console.log('Stop streaming')
			if(listener)
				listener.stop()
		}
	}

	async function setVideo(message) {
		if (childWindow){
			childWindow.close();
			childWindow = null;
		}
		let window_id = message.data;
		if (window_id === 'keep-id') return
		try {
			const stream = await mediaDevices.getUserMedia({
				audio: false,
				video: {
					mandatory: {
						chromeMediaSource: 'desktop',
						chromeMediaSourceId: window_id,
						minWidth: 1280,
						maxWidth: 1280,
						minHeight: 720,
						maxHeight: 720,
					},
				}
			})
			handleStream(stream)
			return
		} catch (e) {
			console.error(e);
		}
		handleStream(null);
	}

	useEffect(()=>{
		window.addEventListener('message', setVideo);
		return () => {
			window.removeEventListener('message', setVideo)
		}
	},[setVideo])

	useEffect(() => {
		window.addEventListener('keydown', chooseTimeLine);
		return () => {
			window.removeEventListener('keydown', chooseTimeLine);
		}
	}, [chooseTimeLine]);

	return(
		isGetMastodon ? (
			<>
				<video autoPlay playsInline width="1280" height="720" className="video_wrapper" >
				</video>
				<div className='screen'>
				{
					comments.map((comment) => {
					return comment
					})
				}{
					timelineView.map((timelinename) => {
					return timelinename
					})
				}{
					hintPocket.map((comment) => {
					return comment
					})
				}
				</div>
			</>
		):(
			<></>
		)
	);
};

export default Comment;

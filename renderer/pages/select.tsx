import React, { useEffect, useState } from 'react';
import style from '../styles/select.module.css';
const { desktopCapturer } = require('electron');

function Select() {
	const [srcs, setSrcs] = useState([]);

	const handleStream = (key, stream) => {
		let replaceKey = key.replaceAll(':', '\\:');
		let str = 'video#thumb_' + replaceKey;
		console.log(str);
		const video: HTMLVideoElement = document.querySelector(str);
		video.srcObject = stream
		video.onsuspend = () => {
			handleStream(key, null);
		};
		video.onloadedmetadata = (e) => {
			console.log(e)
			video.play()
		}
	}

	const selectWindow = (event) => {
		let window_id: string = event.currentTarget.getAttribute('data-id');
		console.log(window_id)
		window.opener.postMessage(window_id, '*')
	}

	useEffect(() => {
		desktopCapturer.getSources({types: ['screen', 'window']}).then(async sources => {
			setSrcs(sources);
		});
	}, [])

	return (
		<div className={style.selectorWrapper}>
			<h3>Please select window</h3>
			<div className={style.cardWrapper}>
				<div className={style.windowItemWrapper}>
					<div className={style.windowItem} onClick={selectWindow} data-src={undefined}>
						<p >グリーンスクリーン</p>
						<div className={style.greenScreen+' thumbnail'} ></div>
					</div>
				</div>
				{srcs.map((src)=>{
					console.log(src)
					if (src.name !== "nico-comme-don"){
						const mediaDevices = navigator.mediaDevices as any;
						mediaDevices.getUserMedia({
							audio: false,
							video: {
								mandatory: {
									chromeMediaSource: 'desktop',
									chromeMediaSourceId: src.id,
									minWidth: 1280,
									maxWidth: 1280,
									minHeight: 720,
									maxHeight: 720,
								},
							}
						}).then((stream) => handleStream(src.id, stream))
						return (
							<div className={style.windowItemWrapper}>
								<div className={style.windowItem} onClick={selectWindow} data-id={src.id}>
									<p key={src.id}>{src.name}</p>
									<video className='thumbnail' id={'thumb_'+src.id} ></video>
								</div>
							</div>
						)
					}
				})}
			</div>
			<div className={style.selectButton}>
				<input type="button" value="戻る" onClick={selectWindow} data-id='keep-id' />
			</div>
		</div>
	);
};

export default Select;

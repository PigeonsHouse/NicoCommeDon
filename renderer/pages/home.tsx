import React, { useEffect, useState } from 'react';
import { Button, InputGroup, FormControl} from 'react-bootstrap';
import Mastodon from 'mastodon-api';
import { NextRouter, useRouter } from 'next/router';
import style from '../styles/home.module.css';
import { ipcRenderer } from 'electron';

function Home() {
	const router: NextRouter = useRouter();
    const [url, setUrl] = useState<string>('https://mastodon.compositecomputer.club');
    const [key, setKey] = useState<string>();
    const [client_id, setId] = useState<string>();
    const [client_secret, setSecret] = useState<string>();
    const [isHealth, setHealth] = useState<boolean>(false);
    let token: string;
	let mstdn;

    const handleSubmitInstance = (e) => {
		e.preventDefault();
		let instanceURL: string = url;
		if(instanceURL.substr(-1) === '/'){
			instanceURL = instanceURL.substr(0, instanceURL.length-1)
			setUrl(instanceURL)
		}
		Mastodon.createOAuthApp(instanceURL + '/api/v1/apps', 'NicoCommeDon')
		.catch(err => console.error(err))
		.then((res) => {
			let tmpId: string;
			let tmpSec: string;
			try{
				setId(res.client_id);
				setSecret(res.client_secret);
				tmpId = res.client_id;
				tmpSec = res.client_secret;
			}catch(err){
				alert("URLが間違っている可能性があります。");
				return null;
			}
			return Mastodon.getAuthorizationUrl(tmpId, tmpSec, url);
		})
		.then(url => {
			if(url === null)
				return;
			let savedUrl: string = url;
			let axios = require('axios');
			let infoUrl: string = instanceURL + '/api/v1/streaming/health'
			axios.get(infoUrl)
			.then((res) => {
				if(res.data === 'OK')
					setHealth(true);
				window.open(savedUrl, "てすと");
			})
			.catch((err) => {
				console.error(err.message);
			})
		})
    }

    const handleSubmitKey = (e) => {
		e.preventDefault()
		Mastodon.getAccessToken(client_id, client_secret, key, url)
		.catch(err => console.error(err.data))
		.then(accessToken => {
			if(!isHealth){
				alert("インスタンスがNicoCommeDonに対応していない可能性があります。");
				return;
			}
			try {
				token = accessToken
				mstdn = new Mastodon({
					access_token: token,
					api_url: url + '/api/v1/',
				})
			} catch (err) {
				alert("認証コードが間違っている可能性があります。");
				return;
			}
			console.log(client_id, client_secret, key, token, url+'/api/v1/', mstdn);
			router.push({
				pathname: "/comment",
				query: {
					token: token,
					url: url
				}
			})
		})
    }

    const handleURLChange = (e) => {
	    setUrl(e.target.value);
    }

    const handleKeyChange = (e) => {
	    setKey(e.target.value);
    }

	useEffect(() => {
		window.addEventListener('contextmenu', (e) => {
			e.preventDefault()
			ipcRenderer.send('show-context-menu')
		})

		ipcRenderer.on('context-menu-command', (e, command) => {
		})
	}, [])

    return (
        <div className={style.tokenPage+" bg-light px-lg-5 vh-100 whole"}>
            <h1 className="pt-4 text-dark text-center">
                NicoCommeDon
            </h1>
            <p className="text-center">
				Mastodonに流れるタイムラインのトゥートを某動画サイトのコメントみたいに流すアプリです。<br />
				グリーンバックや選択した画面にコメントを流れるので配信してみてね。
            </p>
            <form
			onSubmit={handleSubmitInstance} 
			className={style.cannotDrag+" px-2 px-lg-5"}>
				<InputGroup className="px-md-5 pt-4 w-100">
					<InputGroup.Text className="basic-addon3 w-auto d-inline">
						インスタンスURL
					</InputGroup.Text>
					<FormControl
					placeholder="Please input InstanceURL"
					aria-label="Please input InstanceURL"
					aria-describedby="basic-addon3"
					value={url}
					onChange={handleURLChange}
					/>
					<InputGroup.Append>
						<Button variant="outline-secondary" type="submit">認証コードを発行</Button>
					</InputGroup.Append>
				</InputGroup>
            </form>
            <form 
            onSubmit={handleSubmitKey} 
            className={style.cannotDrag+" px-2 px-lg-5"}>
				<InputGroup className="px-md-5 pt-4 w-100">
					<InputGroup.Text className="basic-addon3 w-auto d-inline">
						認証コード
					</InputGroup.Text>
					<FormControl
					placeholder="Please paste here"
					aria-label="Paste AuthenticationCode"
					aria-describedby="basic-addon3"
					value={key}
					onChange={handleKeyChange}
					/>
					<InputGroup.Append>
						<Button variant="outline-secondary" type="submit" id="jumpCommentPage">コメント画面に移動</Button>
					</InputGroup.Append>
				</InputGroup>
            </form>
        </div>
    );
};

export default Home;

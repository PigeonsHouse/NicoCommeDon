import {AppProps} from "next/app";
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/global.css'
import './styles/home.css'
import './styles/comment.css'
import './styles/select.css'

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Component {...pageProps} />
			<style jsx global>{`
			html{
				height: 100%;
				height: 720px;
				width: 1280px;
			}
			body{
				margin: 0;
				height: 100%;
				overflow-x: hidden;
				overflow-y: hidden;
			}
			.whole{
				height: 100%;
			}
			`}</style>
		</>
	)
}

export default MyApp
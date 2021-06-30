import { EventEmitter } from "stream";

export interface HTMLElementEvent<T extends HTMLElement> extends Event {
	ctrlKey: T;
	altKey: T;
	code: string;
}

export interface StreamingAPIConnection extends EventEmitter {
	stop: ()=>void;
}
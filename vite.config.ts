import solid from 'solid-start/vite';
import {defineConfig} from 'vite';

export default defineConfig({
	base: '/visited-cities/',
	plugins: [solid({ssr: false})],
});

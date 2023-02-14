import { EventIterator } from "event-iterator"
import JSZip from "jszip";

export default function Home() {
	const reader = new FileReader();

	const handleImageChange = (event) => {
		const [file] = event.target.files;
		reader.onload = loadZip;
		reader.readAsArrayBuffer(file);
	}

	const loadZip = async () => {
		if (!(reader.result instanceof ArrayBuffer)) {
			return;
		}

		const zip = await JSZip.loadAsync(reader.result);
		const iterator = new EventIterator<JSZip.JSZipObject>(({ push }) => {
			zip.forEach((relativePath, file) => {
				if (relativePath.includes('Semantic Location History') && relativePath.endsWith('.json')) {
					push(file);
				}
			});
		});

		for await (const file of iterator) {
			const data = await file.async('string');
			const parsedData = JSON.parse(data);
			const events = parsedData?.timelineObjects ?? [];

			for (const event of events) {
				if ({}.hasOwnProperty.call(event, 'placeVisit')) {
					console.log(event.placeVisit?.location?.address);
				}
			}
		}
	}

	return (
		<main>
			<input
				type="file"
				accept="application/zip"
				onChange={handleImageChange}
			/>
		</main>
	);
}

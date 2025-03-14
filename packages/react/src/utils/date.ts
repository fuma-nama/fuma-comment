export function toLocalString(date: Date): string {
	const today = new Date(Date.now());

	const isToday =
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate();

	const day = isToday
		? "Today"
		: [
			date.getDate().toString().padStart(2, "0"),
			(date.getMonth() + 1).toString().padStart(2, "0"),
			date.getFullYear(),
		].join("/");

	const time = [
		date.getHours().toString().padStart(2, "0"),
		date.getMinutes().toString().padStart(2, "0"),
	].join(":");

	return `${day} ${time}`;
}

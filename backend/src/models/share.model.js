const shares = [];
let nextShareId = 1;

function findAll() {
	return shares;
}

function findById(id) {
	return shares.find((s) => s.id === Number(id));
}

function findByShareholderId(shareholderId) {
	return shares.filter((s) => s.shareholderId === Number(shareholderId));
}

function create(data) {
	const nuevo = {
		id: nextShareId++,
		shareholderId: Number(data.shareholderId),
		number: data.number || "",
		acquisitionDate:
			data.acquisitionDate || new Date().toISOString().split("T")[0],
		percentage: Number(data.percentage) || 0,
	};
	shares.push(nuevo);
	return nuevo;
}

function update(id, data) {
	const idx = shares.findIndex((s) => s.id === Number(id));
	if (idx === -1) return null;
	shares[idx] = {
		...shares[idx],
		...data,
		id: shares[idx].id,
	};
	return shares[idx];
}

function remove(id) {
	const idx = shares.findIndex((s) => s.id === Number(id));
	if (idx === -1) return false;
	shares.splice(idx, 1);
	return true;
}

module.exports = {
	findAll,
	findById,
	findByShareholderId,
	create,
	update,
	remove,
};

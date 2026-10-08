import Modal from './Modal.jsx';

// request: { title, message, buttons: [{ label, value, kind }], resolve }
export default function ConfirmDialog({ request }) {
  const done = (v) => request?.resolve(v);
  return (
    <Modal open={!!request} onClose={() => done(null)} className="ask">
      {request && (
        <div className="ask-body">
          <h3>{request.title}</h3>
          <p>{request.message}</p>
          <div className="ask-btns">
            {request.buttons.map((b) => (
              <button key={b.label} className={`btn btn-${b.kind || 'ghost'}`} onClick={() => done(b.value)}>{b.label}</button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

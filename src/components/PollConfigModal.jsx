export function PollConfigModal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div style={styles.overlay}>
      <div className="w-auto h-auto bg-light rounded-5 d-flex flex-column align-items-center justify-content-start" style={{ overflowY: "auto", maxHeight: "93vh" }}>
        <div className="d-flex justify-content-between align-items-center w-100 px-4 pt-3">
          <h4 className="fw-semibold pt-1">Poll Menu</h4>
          <button type="button" className="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close" onClick={onClose}></button>
        </div>
        <div className="w-100 my-3" style={{ height: "1px", backgroundColor: "rgba(0, 0, 0, 0.1)" }}></div>
        {children}
        <div className="w-100 my-3" style={{ height: "1px", backgroundColor: "rgba(0, 0, 0, 0.1)" }}></div>
        <button className="btn rounded-5 fw-bold custom-hover mb-4 mt-1 px-4" style={{ backgroundColor: "#9e42f5", color: "white" }} onClick={onClose}>Close Menu</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  }
};
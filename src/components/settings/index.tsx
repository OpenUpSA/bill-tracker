import React, { useEffect, useState } from "react";

import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import Modal from "react-bootstrap/Modal";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSliders
} from "@fortawesome/free-solid-svg-icons";

import "./index.scss";

export const loadSettings = () => {
  return JSON.parse(window.localStorage.getItem('settings') || JSON.stringify(defaultSettings));
}

export const defaultSettings = {
  includeAlternates: false,
  includePermanents: true
}

const saveSettings = (settings) => {
  return window.localStorage.setItem('settings', JSON.stringify(settings));
}

export const SettingsModal = (props) => {

  const { modalSettingsOpen, setModalSettingsOpen, callback, settings } = props;
  const [includeAlternates, setIncludeAlternates] = useState(settings.includeAlternates);
  const [includePermanents, setIncludePermanents] = useState(settings.includePermanents);

  const saveSettingsAndClose = () => {
    const settings = {
      includeAlternates: includeAlternates,
      includePermanents: includePermanents
    };
    saveSettings(settings);
    setModalSettingsOpen(false);
    callback(settings);
  };

  useEffect(() => {

  }, [modalSettingsOpen]);

  return (
    <Modal show={modalSettingsOpen} onHide={() => setModalSettingsOpen(false)}>
      <Modal.Header>
        <Modal.Title>
          <FontAwesomeIcon icon={faSliders} className="mr-2" />
          Settings
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="status-toggle mb-4">
          <Stack direction="horizontal" gap={3}>
            <label className="pt-2 fs-6" htmlFor="includePermanents">Include full committee memberships data</label>
            <Form.Check
              id="includePermanents"
              type="switch"
              onChange={() => setIncludePermanents(!includePermanents)}
              checked={includePermanents}
              className="ms-auto"
            />
          </Stack>
        </div>
        <div className="status-toggle mb-4">
          <Stack direction="horizontal" gap={3}>
            <label className="pt-2 fs-6" htmlFor="includeAlternates">Include alternate committee memberships data</label>
            <Form.Check
              id="includeAlternates"
              type="switch"
              onChange={() => setIncludeAlternates(!includeAlternates)}
              checked={includeAlternates}
              className="ms-auto"
            />
          </Stack>
        </div>
        <p className="color-foreground-muted">
          Memberships to a committee can either be "full memberships"<br /> or "alternate memberships". Alternates to a committee can attend meetings and take part in discussions, but have no voting rights and cannot hold a leadership position within the committee. Alternates are not expected to be in every committee meeting.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Stack direction="horizontal" gap={3} className="full-width">
          <button className="toolbarButton float-left" onClick={() => setModalSettingsOpen(false)}>
            Cancel
          </button>
          <button className="toolbarButton primary ms-auto" onClick={saveSettingsAndClose}>
            Save settings
          </button>
        </Stack>
      </Modal.Footer>
    </Modal>

  );
}

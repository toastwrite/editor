export { Editor } from './editor.js';
export { Viewer } from './viewer.js';
export type {
  EditorOptions,
  ViewerOptions,
  EditorPlugin,
  EditorPluginContext,
  PreviewStyle,
  EditorEventMap,
  EditorEventName,
  EventHandler,
  SelectionPos,
  CommandId,
} from './types.js';

export { Editor as default } from './editor.js';

import 'prosemirror-view/style/prosemirror.css';
import './styles/editor.css';
import './styles/md-syntax-highlighting.css';

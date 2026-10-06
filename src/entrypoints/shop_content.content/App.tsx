import { FloatingTool } from './FloatingTool';
import styles from './shop_content.module.scss';
import { tools } from './tools';

export function App() {
  const availableTools = tools.filter(tool => tool.isAvailable?.() ?? true);

  return (
    <div className={styles.tools}>
      {availableTools.map(tool => (
        <FloatingTool key={tool.id} {...tool} />
      ))}
    </div>
  );
}

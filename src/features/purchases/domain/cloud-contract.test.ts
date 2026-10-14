import { describe,it,expect } from 'vitest';
import {demoSeed,products} from './test-fixtures';
import {groupNeeds,signature,comparison} from './model';
describe('Contrato del piloto agregado',()=>{
 it('usa la versión del servidor para confirmar sin exponer detalles ajenos',()=>{const s=demoSeed();const key=groupNeeds(s,products)[0].key;s.groupVersions={[key]:'server-version-1'};expect(signature(groupNeeds(s,products)[0])).toBe('server-version-1');});
 it('usa reparto propio calculado por servidor, no el agregado de otros puestos',()=>{const s=demoSeed();const key=groupNeeds(s,products)[0].key;s.groupFreight={[key]:8.99};expect(comparison(groupNeeds(s,products)[0],'DEMO-01').collective).toBe(545.99);});
});

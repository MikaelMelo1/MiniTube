import {describe,it,expect} from 'vitest';
import {videoId,playbackError,secondsFromIsoDuration,formatDuration,formatPublishedDate} from './youtube';
describe('URLs confiáveis',()=>{
 it('aceita watch e Shorts',()=>{expect(videoId('https://www.youtube.com/watch?v=M7lc1UVf-VE')).toBe('M7lc1UVf-VE');expect(videoId('https://youtube.com/shorts/M7lc1UVf-VE')).toBe('M7lc1UVf-VE')});
 it('recusa hosts maliciosos e protocolos',()=>{for(const url of ['javascript:alert(1)','https://youtube.com.evil.com/watch?v=M7lc1UVf-VE','http://youtu.be/M7lc1UVf-VE','https://evil@youtu.be/M7lc1UVf-VE','https://youtu.be/bad'])expect(videoId(url)).toBeNull()});
 it('explica a falha de identificação',()=>expect(playbackError(153)).toContain('153'));
});
describe('duração dos vídeos',()=>{
 it('exibe a data de publicação e ignora datas ausentes',()=>{expect(formatPublishedDate('2026-10-20T00:15:00Z')).toBe('20/10/2026');expect(formatPublishedDate(undefined)).toBeNull();expect(formatPublishedDate('inválida')).toBeNull()});
 it('converte a duração oficial da API para segundos',()=>{expect(secondsFromIsoDuration('PT1H2M3S')).toBe(3723);expect(secondsFromIsoDuration('PT5M9S')).toBe(309)});
 it('mostra duração compacta na lista de pesquisa',()=>{expect(formatDuration(3723)).toBe('1:02:03');expect(formatDuration(309)).toBe('5:09');expect(formatDuration(undefined)).toBe('—')});
});

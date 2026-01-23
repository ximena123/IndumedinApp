export interface Medidas {
  id: string;
  clienteId: string;
  busto: number;
  cintura: number;
  cadera: number;
  hombro: number;
  largoManga: number;
  largoPantalon: number;
  createdAt: Date;
  updatedAt: Date;
  activo?: boolean;
}

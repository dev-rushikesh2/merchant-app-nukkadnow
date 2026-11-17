import { Injectable, inject } from '@angular/core';
import { QueueBoardApi } from './queue-board.api';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QueueBoardRepository {
  private api = inject(QueueBoardApi);

  getList(): Observable<any[]> {
    return this.api.fetchList();
  }
}

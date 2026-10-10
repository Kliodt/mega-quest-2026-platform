import { type AdminBindingsDto } from '@quest/shared';
import { BindingModel } from '../../models/Binding.js';
import { QuestionModel } from '../../models/Question.js';
import { toAdminBindingDtos } from '../../utils/binding/toAdminBindingDtos.js';

/** Все коды на дверях по корпусам и аудиториям. */
export async function getAdminBindings(): Promise<AdminBindingsDto> {
  const [bindings, questions] = await Promise.all([
    BindingModel.find().sort({ location: 1, roomNumber: 1 }).lean(),
    QuestionModel.find().select('rooms').lean(),
  ]);
  return {
    bindings: toAdminBindingDtos(
      bindings,
      questions.flatMap((question) => question.rooms),
    ),
  };
}
